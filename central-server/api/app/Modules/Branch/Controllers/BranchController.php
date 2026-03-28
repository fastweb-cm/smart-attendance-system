<?php
namespace App\Modules\Branch\Controllers;

use App\Core\Controller;
use App\Modules\Branch\Models\BranchModel;

class BranchController extends Controller {
    private BranchModel $branch;
    public function __construct()
    {
        $this->branch = new BranchModel();
    }
    public function store()
    {
        $data = $this->getJsonInput();

        $this->branch->setName($data["name"]);
        $this->branch->setDescription($data["description"] ?? null);
        $this->branch->setLocation($data["location"]);
        $this->branch->setStatus($data["status"] ?? 'active');

        if($this->branch->create($data["branch_admins"])){
            $this->json([
                "success" => true,
                "message" => "Branch created successfully"
            ]);
        }

        $this->json([
            "success" => false,
            "message" => "An unexpected error occurred"
        ],500);
    }

    public function all()
    {
        $branches = $this->branch->fetch();

        $this->json([
            "success"=> true,
            "data" => $branches
        ]);
    }

    public function one(int $branchId)
    {
        $branch = $this->branch->fetch((int)$branchId);

        $this->json([
            "success"=> true,
            "data" => $branch
        ]);
    }

    public function delete($id)
    {
        if($this->branch->delete((int)$id)){
            $this->json([
                "success" => true,
                "message" => "Branch id ".$id." deleted successfully"
            ]);
        }

        $this->json([
            "success" => false,
            "message" => "An unexpected error occured"
        ]);
    }

    public function edit(int $branchId){
        $data = $this->getJsonInput();

        $this->branch->setId($branchId);

        $this->branch->setName($data["name"]);
        $this->branch->setDescription($data["description"] ?? null);
        $this->branch->setLocation($data["location"]);
        $this->branch->setStatus($data["status"] ?? 'active');

        if($this->branch->update($data["branch_admins"])){
            $this->json([
                "success" => true,
                "message" => "Branch updated successfully"
            ]);
        }

        $this->json([
            "success" => false,
            "message" => "An unexpected error occurred"
        ],500);
    }
}
